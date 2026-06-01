import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Archive | AIHub",
  description: "Discover, download, and share AI skills and agents created by the community",
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
