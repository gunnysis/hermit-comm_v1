import * as posts from './posts';
import * as comments from './comments';
import * as reactions from './reactions';
import * as analysis from './analysis';
import * as health from './health';
import * as recommendations from './recommendations';
import * as trending from './trending';
import * as my from './my';
import * as notifications from './notifications';
import * as blocks from './blocks';

export { APIError } from './error';
export const api = {
  getPosts: posts.getPosts,
  searchPosts: posts.searchPosts,
  getPostsByEmotion: posts.getPostsByEmotion,
  getPost: posts.getPost,
  createPost: posts.createPost,
  deletePost: posts.deletePost,
  updatePost: posts.updatePost,
  getComments: comments.getComments,
  createComment: comments.createComment,
  updateComment: comments.updateComment,
  deleteComment: comments.deleteComment,
  getPostReactions: reactions.getPostReactions,
  toggleReaction: reactions.toggleReaction,
  getEmotionTrend: analysis.getEmotionTrend,
  getPostAnalysis: analysis.getPostAnalysis,
  invokeSmartService: analysis.invokeSmartService,
  healthCheck: health.healthCheck,
  getRecommendedPosts: recommendations.getRecommendedPosts,
  getTrendingPosts: trending.getTrendingPosts,
  getActivitySummary: my.getActivitySummary,
  getEmotionTimeline: my.getEmotionTimeline,
  getDailyInsights: my.getDailyInsights,
  getYesterdayDailyReactions: my.getYesterdayDailyReactions,
  getSameMoodDailies: my.getSameMoodDailies,
  getMyAlias: my.getMyAlias,
  createDailyPost: posts.createDailyPost,
  updateDailyPost: posts.updateDailyPost,
  getTodayDaily: posts.getTodayDaily,
  getNotifications: notifications.getNotifications,
  getUnreadCount: notifications.getUnreadCount,
  markNotificationsRead: notifications.markRead,
  markAllNotificationsRead: notifications.markAllRead,
  blockUser: blocks.blockUser,
  unblockUser: blocks.unblockUser,
  getBlockedAliases: blocks.getBlockedAliases,
};
