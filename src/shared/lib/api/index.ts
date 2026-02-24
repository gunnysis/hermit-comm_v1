import * as posts from './posts';
import * as comments from './comments';
import * as reactions from './reactions';
import * as analysis from './analysis';
import * as health from './health';
import * as recommendations from './recommendations';

export { APIError } from './error';
export const api = {
  getPosts: posts.getPosts,
  searchPosts: posts.searchPosts,
  getPost: posts.getPost,
  createPost: posts.createPost,
  deletePost: posts.deletePost,
  updatePost: posts.updatePost,
  getComments: comments.getComments,
  createComment: comments.createComment,
  updateComment: comments.updateComment,
  deleteComment: comments.deleteComment,
  getReactions: reactions.getReactions,
  getUserReactions: reactions.getUserReactions,
  toggleReaction: reactions.toggleReaction,
  getEmotionTrend: analysis.getEmotionTrend,
  getPostAnalysis: analysis.getPostAnalysis,
  invokeSmartService: analysis.invokeSmartService,
  healthCheck: health.healthCheck,
  getRecommendedPosts: recommendations.getRecommendedPosts,
};
