import Header from "./common/header";
import Footer from "./common/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="print:p-0">{children}</main>
      <Footer />
    </>
  );
}
