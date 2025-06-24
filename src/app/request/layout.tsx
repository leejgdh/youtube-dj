import { Metadata } from "next";

export const metadata: Metadata = {
  title: "신청곡 등록 - YouTube DJ",
  description: "YouTube DJ에 실시간으로 신청곡을 등록하세요. YouTube 영상 URL과 닉네임만 입력하면 즉시 재생 목록에 추가됩니다.",
  keywords: ["YouTube", "DJ", "신청곡", "등록", "음악", "실시간"],
  openGraph: {
    title: "신청곡 등록 - YouTube DJ",
    description: "YouTube DJ에 실시간으로 신청곡을 등록하세요",
    type: "website"
  }
};

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
