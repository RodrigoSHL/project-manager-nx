#!/usr/bin/env python3
"""Upload an archive to the private OCI backup bucket and verify its bytes."""

import argparse
import base64
import hashlib
import os
import sys

import oci


NAMESPACE = "axqqg7mdu7lk"
BUCKET = "atomdev-prod-backups-scl"
CHUNK_SIZE = 1024 * 1024


def digests(path):
    sha256 = hashlib.sha256()
    md5 = hashlib.md5()
    size = 0
    with open(path, "rb") as source:
        while True:
            chunk = source.read(CHUNK_SIZE)
            if not chunk:
                break
            size += len(chunk)
            sha256.update(chunk)
            md5.update(chunk)
    return size, sha256.hexdigest(), base64.b64encode(md5.digest()).decode("ascii")


def client():
    signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
    return oci.object_storage.ObjectStorageClient({}, signer=signer)


def upload(path, object_name):
    size, expected_sha256, content_md5 = digests(path)
    if size == 0:
        raise ValueError("El archivo de respaldo está vacío")

    storage = client()
    with open(path, "rb") as source:
        storage.put_object(
            NAMESPACE,
            BUCKET,
            object_name,
            source,
            content_length=size,
            content_md5=content_md5,
            if_none_match="*",
        )

    # Reading the object back detects truncated or altered uploads, not only
    # a successful HTTP response. No second local copy is needed.
    response = storage.get_object(NAMESPACE, BUCKET, object_name)
    actual_sha256 = hashlib.sha256()
    actual_size = 0
    for chunk in response.data.raw.stream(CHUNK_SIZE, decode_content=False):
        actual_sha256.update(chunk)
        actual_size += len(chunk)
    if actual_size != size or actual_sha256.hexdigest() != expected_sha256:
        raise RuntimeError("El respaldo remoto no coincide con el archivo local")

    print("Verificado: {} ({} bytes, sha256 {})".format(object_name, size, expected_sha256))


def download(path, object_name):
    storage = client()
    response = storage.get_object(NAMESPACE, BUCKET, object_name)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(path, flags, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as target:
            for chunk in response.data.raw.stream(CHUNK_SIZE, decode_content=False):
                target.write(chunk)
    except BaseException:
        os.unlink(path)
        raise
    size, sha256, _ = digests(path)
    print("Descargado: {} ({} bytes, sha256 {})".format(object_name, size, sha256))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("upload", "download"))
    parser.add_argument("path")
    parser.add_argument("object_name")
    args = parser.parse_args()
    if args.action == "upload":
        upload(args.path, args.object_name)
    else:
        download(args.path, args.object_name)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("Error de Object Storage: {}".format(error), file=sys.stderr)
        sys.exit(1)
