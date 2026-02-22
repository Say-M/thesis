import Header from "./common/header";
import Footer from "./common/footer";
import AppBar from "./common/app-bar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-col h-svh overflow-hidden">
      <Header />
      <ScrollArea className="flex-1 overflow-hidden [&>div>div]:block!">
        <main className="print:p-0">{children}</main>
        <Footer />
      </ScrollArea>
      <AppBar />
    </section>
  );
}
