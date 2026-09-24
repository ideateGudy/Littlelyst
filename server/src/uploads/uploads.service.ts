import { Injectable } from "@nestjs/common";
import crypto from "crypto";

@Injectable()
export class UploadsService {
  private get cloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME || "dqbqawtxo";
  }

  private get apiKey(): string {
    return process.env.CLOUDINARY_API_KEY || "672818364393564";
  }

  private get apiSecret(): string {
    return process.env.CLOUDINARY_API_SECRET || "hqNS0osyq5me2kjHb7wce5NIJvk";
  }

  /**
   * Generates a cryptographically signed signature for Cloudinary direct client upload.
   */
  generateUploadSignature(folder: string = "littlelyst/listings") {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Cloudinary signed parameters must be sorted alphabetically
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign)
      .digest("hex");

    return {
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
    };
  }
}
