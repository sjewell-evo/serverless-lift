"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var aws_exports = {};
__export(aws_exports, {
  awsRequest: () => awsRequest,
  emptyBucket: () => emptyBucket,
  invalidateCloudFrontCache: () => invalidateCloudFrontCache
});
module.exports = __toCommonJS(aws_exports);
async function awsRequest(params, service, method, provider) {
  return await provider.request(service, method, params);
}
async function emptyBucket(aws, bucketName) {
  var _a, _b;
  let keyMarker;
  let versionIdMarker;
  do {
    const data = await aws.request(
      "S3",
      "listObjectVersions",
      { Bucket: bucketName, KeyMarker: keyMarker, VersionIdMarker: versionIdMarker }
    );
    const objects = [...(_a = data.Versions) != null ? _a : [], ...(_b = data.DeleteMarkers) != null ? _b : []].map(({ Key, VersionId }) => ({ Key, VersionId })).filter((o) => o.Key !== void 0 && o.VersionId !== void 0);
    if (objects.length > 0) {
      await aws.request("S3", "deleteObjects", {
        Bucket: bucketName,
        Delete: { Objects: objects }
      });
    }
    keyMarker = data.IsTruncated === true ? data.NextKeyMarker : void 0;
    versionIdMarker = data.IsTruncated === true ? data.NextVersionIdMarker : void 0;
  } while (keyMarker !== void 0);
}
async function invalidateCloudFrontCache(aws, distributionId) {
  await aws.request("CloudFront", "createInvalidation", {
    DistributionId: distributionId,
    InvalidationBatch: {
      // This should be a unique ID: we use a timestamp
      CallerReference: Date.now().toString(),
      Paths: {
        // Invalidate everything
        Items: ["/*"],
        Quantity: 1
      }
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  awsRequest,
  emptyBucket,
  invalidateCloudFrontCache
});
//# sourceMappingURL=aws.js.map
