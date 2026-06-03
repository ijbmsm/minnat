import { SajuPage } from "@/components/saju-page";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "사주 · 민낯",
  description: "생년월일시로 보는 사주팔자. 일간 성격, 오행 분포, 십신 분석.",
};

export default function Page() {
  return (
    <>
      <Nav />
      <SajuPage />
    </>
  );
}
