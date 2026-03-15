import type {
    DeleteObjectsOutput,
    DeleteObjectsRequest,
    ListObjectVersionsOutput,
    ListObjectVersionsRequest,
} from "aws-sdk/clients/s3";
import type { CreateInvalidationRequest, CreateInvalidationResult } from "aws-sdk/clients/cloudfront";
import type { AwsProvider } from "@lift/providers";
import type { Provider as LegacyAwsProvider } from "../types/serverless";

// This is defined as a separate function to allow mocking in tests
export async function awsRequest<Input, Output>(
    params: Input,
    service: string,
    method: string,
    provider: LegacyAwsProvider
): Promise<Output> {
    return await provider.request<Input, Output>(service, method, params);
}

export async function emptyBucket(aws: AwsProvider, bucketName: string): Promise<void> {
    let keyMarker: string | undefined;
    let versionIdMarker: string | undefined;
    do {
        const data = await aws.request<ListObjectVersionsRequest, ListObjectVersionsOutput>(
            "S3",
            "listObjectVersions",
            { Bucket: bucketName, KeyMarker: keyMarker, VersionIdMarker: versionIdMarker }
        );
        const objects = [...(data.Versions ?? []), ...(data.DeleteMarkers ?? [])]
            .map(({ Key, VersionId }) => ({ Key, VersionId }))
            .filter((o): o is { Key: string; VersionId: string } => o.Key !== undefined && o.VersionId !== undefined);
        if (objects.length > 0) {
            await aws.request<DeleteObjectsRequest, DeleteObjectsOutput>("S3", "deleteObjects", {
                Bucket: bucketName,
                Delete: { Objects: objects },
            });
        }
        keyMarker = data.IsTruncated === true ? data.NextKeyMarker : undefined;
        versionIdMarker = data.IsTruncated === true ? data.NextVersionIdMarker : undefined;
    } while (keyMarker !== undefined);
}

export async function invalidateCloudFrontCache(aws: AwsProvider, distributionId: string): Promise<void> {
    await aws.request<CreateInvalidationRequest, CreateInvalidationResult>("CloudFront", "createInvalidation", {
        DistributionId: distributionId,
        InvalidationBatch: {
            // This should be a unique ID: we use a timestamp
            CallerReference: Date.now().toString(),
            Paths: {
                // Invalidate everything
                Items: ["/*"],
                Quantity: 1,
            },
        },
    });
}
