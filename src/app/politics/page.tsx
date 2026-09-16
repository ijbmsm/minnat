import { HomePage } from "@/components/home-page";
import { getEvents } from "@/lib/data";

export const metadata = {
  title: "정치 스코어보드",
  description: "검찰 기소·법원 판결·윤리위 처분 같은 공식 처분만 모아 이슈 단위로 기록합니다. 정치인 개인 점수와 랭킹은 만들지 않습니다.",
  alternates: { canonical: "https://drinkplace.kr/politics" },
};

export const revalidate = 300;

export default async function Page() {
  const events = await getEvents({ limit: 1000 });
  return <HomePage events={events} />;
}
