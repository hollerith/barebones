import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prismaClient';

type PageProps = {
    searchParams: {
        shop: string | undefined;
    };
}

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

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-red-500">Barebones</h1>
            <h2>HomePage</h2>
            <div>Shop: {shop}</div>
            <div>Access Token: {accessToken}</div>
        </main>
    )
}
