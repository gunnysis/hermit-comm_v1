import type { Router } from 'expo-router';

/** 라우팅 헬퍼 — 타입 단언을 한 곳에서만 사용. */
function nav(router: Router, method: 'push' | 'replace', path: string): void {
  router[method](path as Parameters<Router['push']>[0]);
}

export const pushAdmin = (router: Router) => nav(router, 'push', '/admin');
export const pushAdminLogin = (router: Router) => nav(router, 'push', '/admin/login');
export const replaceAdmin = (router: Router) => nav(router, 'replace', '/admin');
export const replaceAdminLogin = (router: Router) => nav(router, 'replace', '/admin/login');

export const pushPost = (router: Router, postId: number | string) =>
  nav(router, 'push', `/post/${postId}`);
export const pushCreate = (router: Router) => nav(router, 'push', '/create');
export const pushSearch = (router: Router) => nav(router, 'push', '/search');
export const pushTabs = (router: Router) => nav(router, 'push', '/(tabs)');
export const pushGroup = (router: Router, groupId: string | number) =>
  nav(router, 'push', `/groups/${groupId}`);
export const pushGroupCreate = (router: Router, groupId: string | number, boardId: number) =>
  nav(router, 'push', `/groups/create?groupId=${groupId}&boardId=${boardId}`);
