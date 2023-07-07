let likes = 42;

export const getLikes = () => likes;

export const incrementLikes = (by: number) => {
	likes += by;
	return likes;
};
