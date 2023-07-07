let userId = "";

export const getUserId = () => userId;

export const updateUserId = (newUserId: string) => {
	userId = newUserId;
	return userId;
};
