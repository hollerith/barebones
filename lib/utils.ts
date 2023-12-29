import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function graphql(query: string, shop: string , accessToken: string) {
    const headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
    };

    try {
        const response = await fetch(`https://${shop}/admin/api/2023-04/graphql.json`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data: ', error);
        return null;
    }
}