export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  followerDisplayName: string;
  followingDisplayName: string;
  createdAt: string;
}

export interface ListFollowingResponse {
  following: Follow[];
}

export interface ListFollowersResponse {
  followers: Follow[];
}
