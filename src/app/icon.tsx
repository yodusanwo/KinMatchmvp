import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#D5E0D5",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left silhouette (forest green) */}
          <circle cx="12" cy="12" r="4" fill="#2F4032" />
          <path
            d="M6 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6H6v-6z"
            fill="#2F4032"
          />
          
          {/* Right silhouette (terracotta) */}
          <circle cx="20" cy="12" r="4" fill="#B65232" />
          <path
            d="M14 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6h-12v-6z"
            fill="#B65232"
          />
          
          {/* Overlap/intersection (mustard) */}
          <defs>
            <clipPath id="clip">
              <circle cx="12" cy="12" r="4" />
              <path d="M6 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6H6v-6z" />
            </clipPath>
          </defs>
          <g clip-path="url(#clip)">
            <circle cx="20" cy="12" r="4" fill="#C68F3E" />
            <path
              d="M14 20c0-2.2 2.7-4 6-4s6 1.8 6 4v6h-12v-6z"
              fill="#C68F3E"
            />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
