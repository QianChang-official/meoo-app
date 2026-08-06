`client.ts` 和 `type.ts` 是自动生成的，禁止任何修改！
`client.ts` 中必须通过
```ts
export function getSupabaseUrl(): string {
  return `${(window as any).MEOO_CONFIG?.meoo_app_access_url || window.location.origin}/sb-api`;
}
```
动态获取正确的 supabase url。
只有在小程序构建时，才使用 vite 插件替换成 package.json 中配置的小程序专属 supabase url.