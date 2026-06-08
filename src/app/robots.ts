import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/mypage/", "/report/"],
      },
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: "",
      },
    ],
    sitemap: [
      "https://drinkplace.kr/sitemap.xml",
      "https://drinkplace.kr/rss.xml",
    ],
  };
}
