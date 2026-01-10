import { useState } from 'react';
import { ShoppingBag, Star, Sparkles, Crown, Gem, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: 'boost' | 'cosmetic' | 'special';
  popular?: boolean;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Speed Boost',
    description: 'Mine 2x faster por 1 hora',
    price: 50,
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    category: 'boost',
    popular: true,
  },
  {
    id: '2',
    name: 'Golden Pickaxe',
    description: 'Skin dourada para sua picareta',
    price: 100,
    icon: <Star className="w-8 h-8 text-yellow-500" />,
    category: 'cosmetic',
  },
  {
    id: '3',
    name: 'Diamond Pack',
    description: 'Pacote com 500 moedas bônus',
    price: 200,
    icon: <Gem className="w-8 h-8 text-cyan-400" />,
    category: 'special',
    popular: true,
  },
  {
    id: '4',
    name: 'Crown Badge',
    description: 'Distintivo exclusivo de coroa',
    price: 150,
    icon: <Crown className="w-8 h-8 text-amber-400" />,
    category: 'cosmetic',
  },
  {
    id: '5',
    name: 'Lucky Charm',
    description: 'Aumenta chance de bônus em 10%',
    price: 75,
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    category: 'boost',
  },
  {
    id: '6',
    name: 'VIP Pass',
    description: 'Acesso a recursos exclusivos',
    price: 500,
    icon: <Star className="w-8 h-8 text-primary" />,
    category: 'special',
  },
];

const categoryColors = {
  boost: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  cosmetic: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  special: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
};

const categoryLabels = {
  boost: 'Boost',
  cosmetic: 'Cosmético',
  special: 'Especial',
};

export default function Boutique() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'boost' | 'cosmetic' | 'special'>('all');

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.category === filter);

  const handlePurchase = (product: Product) => {
    toast({
      title: "Em breve!",
      description: `A compra de "${product.name}" estará disponível em breve.`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-primary neon-text-green">
              Boutique LEONOR
            </h1>
            <p className="text-muted-foreground">Melhore sua experiência de mineração</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'boost', 'cosmetic', 'special'] as const).map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
              className="capitalize"
            >
              {cat === 'all' ? 'Todos' : categoryLabels[cat]}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id}
              className={`relative overflow-hidden bg-gradient-to-br ${categoryColors[product.category]} border transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10`}
            >
              {product.popular && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-4 rounded-full bg-background/50 mb-2">
                  {product.icon}
                </div>
                <CardTitle className="text-xl">{product.name}</CardTitle>
                <Badge variant="outline" className="w-fit mx-auto">
                  {categoryLabels[product.category]}
                </Badge>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-sm">
                  {product.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="text-2xl font-bold text-primary">
                  {product.price} <span className="text-sm text-muted-foreground">moedas</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(product)}
                >
                  Comprar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
