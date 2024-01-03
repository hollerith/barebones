import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prismaClient';
import { ShoppingCart } from 'lucide-react';
import { graphql } from '@/lib/utils';
import Image from 'next/image';

type PageProps = {
    searchParams: {
        shop: string | undefined;
    };
}

type ProductImage = {
    src: string;
};

type Product = {
    id: string;
    title: string;
    description: string;
    images: {
        edges: Array<{ node: ProductImage }>;
    };
};

type ProductData = {
    data: {
        products: {
            edges: Array<{ node: Product }>;
        };
    };
};

export default async function HomePage({ searchParams }: Readonly<PageProps>) {
    const shop = searchParams.shop;

    const accessToken = shop ? (await prisma.token.findUnique({
        where: {
            shop: shop,
        },
        select: {
            token: true,
        },
    }))?.token : null;

    if (!accessToken) {
        const redirectUri = `${process.env.CLOUDFLARE_URL}/auth`;
        const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SCOPES}&redirect_uri=${redirectUri}`;
        redirect(authUrl);
        return null;
    }

    const productQuery = `
    {
      products(first: 10, query: "tag:'Subscribe'") {
        edges {
          node {
            id
            title
            description
            images(first: 1) {
              edges {
                node {
                  src
                }
              }
            }
          }
        }
      }
    }`;

    const products = shop ? await graphql(productQuery, shop, accessToken) as ProductData : null;

    return (
        <>
            <div className='h-[5vh] min-h-[12em] top-0 sticky'>
                <div className='absolute inset-0 flex justify-center items-center'>
                    <div className='leftimage w-1/2 h-full relative'>
                    </div>
                    <div className='rightimage w-1/2 h-full relative'>
                        <div className='absolute embossed top-2 right-2 p-2 rounded-full'>
                            <ShoppingCart color="darkgoldenrod" size={24} />
                        </div>
                        <h1 className='embossedtext absolute bottom-2 left-2 text-lg p-2'>
                            {shop}
                        </h1>
                    </div>
                </div>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='masthead max-w-[max-content] rounded-full px-6'>
                        <div className='gold'>BAREBONES</div>
                    </div>
                </div>
            </div>
            <main className='flex min-h-screen flex-col items-center justify-between p-24'>
                <div className="grid grid-cols-6 gap-8">
                    {products?.data.products.edges.map(({ node: product }) => (
                        <div key={product.id} className="col-span-1 mb-4">
                            <div className="card bg-gray-300 flex flex-col items-center justify-between p-4">
                                {product.images.edges.length > 0 && (
                                    <div className="card-img-top">
                                        <Image
                                            src={product.images.edges[0].node.src}
                                            alt={product.description}
                                            layout="responsive"
                                            width={100}
                                            height={128}
                                            className='rounded-lg'
                                        />
                                    </div>
                                )}
                                <div className="card-bod flex flex-col justify-between h-1/3">
                                    <h5 className="card-title text-amber-500 embossedtext text-small p-4 w-full">{product.title}</h5>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </>
    )
}
