"use client"; 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Local imports 
import { LinkFormData, linkSchema } from "../schemas/linkSchema";
import { createShortLink } from "@/src/services/linkService";
import { create } from "domain";
import { error } from "console";
import { useState } from "react";

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

    const result = await createShortLink(
      data.longUrl
    );

    setShortUrl(
      `http://localhost:8000/${result.shortCode}`
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <input
        {...register("longUrl")}
        placeholder="Enter URL"
      />

      {
        errors.longUrl &&
        <p>{errors.longUrl.message}</p>
      }

      <button type="submit">
        Shorten
      </button>

      {
        shortUrl &&
        (
          <div>

            <p>Your Short URL:</p>

            <a
              href={shortUrl}
              target="_blank"
            >
              {shortUrl}
            </a>

          </div>
        )
      }

    </form>
  );
}