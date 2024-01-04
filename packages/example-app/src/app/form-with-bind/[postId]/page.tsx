import Link from "next/link";
import { updatePost } from "../update-post-action";

export default function UpdatePostPage({
  params,
}: {
  params: { postId: string };
}) {
  const action = updatePost.bind(null, params.postId);

  return (
    <>
      <Link href="/">Go to home</Link>
      <form action={action}>
        <input name="title" placeholder="Post title" required />
        <textarea name="content" required placeholder="Post content" />
        <button type="submit">Update post</button>
      </form>
    </>
  );
}
