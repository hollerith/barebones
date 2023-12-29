import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prismaClient';
import crypto from 'crypto';
import fetch from 'node-fetch';

type PageProps = {
    searchParams: {
        shop: string;
        hmac: string;
        code: string;
    };
}

export default async function AuthPage({ searchParams }: Readonly<PageProps>) {
    const { shop, hmac: hmacReceived, code } = searchParams;

    if (!hmacReceived || !process.env.SHOPIFY_API_SECRET) {
        throw new Error('HMAC missing or secret not set');
    }

    const { hmac, ...restParams } = searchParams;
    const sortedParams = Object.entries(restParams)
                               .sort(([a], [b]) => a.localeCompare(b))
                               .map(([key, value]) => `${key}=${value}`)
                               .join('&');

    const hmacCalculated = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET)
                                  .update(sortedParams)
                                  .digest('hex');

    if (hmacCalculated !== hmacReceived) {
        throw new Error('HMAC validation failed');
    }

    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code,
        }),
    });

    if (response.status === 200) {
        const data = await response.json() as { access_token: string };
        const accessToken = data.access_token;

        await prisma.token.upsert({
            where: { shop },
            update: { token: accessToken },
            create: { shop, token: accessToken },
        });

        return redirect(`/?shop=${shop}`);
    }

    throw new Error('Error in OAuth process');
}
