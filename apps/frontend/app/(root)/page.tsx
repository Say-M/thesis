import Banner from "./banner";
import Category from "./category";
import Featured from "./featured";
import CategoryProducts from "./category-products";

export default function Home() {
  return (
    <>
      <Banner />
      <Category />
      <Featured />
      <CategoryProducts />
    </>
  );
}
