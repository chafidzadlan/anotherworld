"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp", "image/gif"];

interface HeroImageUploadProps {
  onImageSelect: (file: File) => void;
}

export function HeroImageUpload({ onImageSelect }: HeroImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validateImage = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPG, JPEG, PNG, WebP, or GIF Image"
      });
      return false;
    };

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Image must be less than 5MB",
      });
      return false;
    };

    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateImage(file)) {
        setImagePreview(URL.createObjectURL(file));
        onImageSelect(file);
      } else {
        e.target.value = "";
      };
    };
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <Upload className="h-4 w-4" />
        <Input
          type="file"
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={handleImageSelect}
          className="flex-1"
        />
      </div>
      {imagePreview && (
        <div className="relative">
          <Image
            src={imagePreview}
            alt="Hero Preview"
            width={64}
            height={64}
            className="rounded object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-5 h-5"
            onClick={handleRemoveImage}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};