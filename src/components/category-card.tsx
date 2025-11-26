import Link from "next/link";
import { Category } from "@/data/mock-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  category: Category;
};

export function CategoryCard({ category }: Props) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
        </CardHeader>
        <CardContent>
          {category.subcategories && (
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((sub) => (
                <Badge key={sub.slug} variant="secondary">
                  {sub.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

