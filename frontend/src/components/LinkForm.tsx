"use client"; 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { useState } from "react";

// Local imports 
import { LinkFormData, linkSchema } from "../schemas/linkSchema";
import { createShortLink } from "@/src/services/linkService";
import { apiConfig } from "../lib/apiConfig"; // Import the config

export default function LinkForm() {
  const [shortUrl, setShortUrl] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const onSubmit = async (data: LinkFormData) => {
    const result = await createShortLink(data.longUrl);
    
    // Use the central config here
    setShortUrl(`${apiConfig.baseUrl}/${result.shortCode}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("longUrl")} placeholder="Enter URL" />
      {errors.longUrl && <p>{errors.longUrl.message}</p>}
      <button type="submit">Shorten</button>

      {shortUrl && (
        <div>
          <p>Your Short URL:</p>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </div>
      )}
    </form>
  );
}