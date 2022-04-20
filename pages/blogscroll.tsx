import { gql, useQuery, NetworkStatus } from "@apollo/client";
import { GetStaticPropsContext } from "next";

import { initializeApollo, addApolloState } from "../lib/apolloClient";
import Layout from "../components/Layout";

interface Post {
  databaseId: number;
  title: string;
};

interface PostEdge {
  node: Post;
};

const POSTS_PER_PAGE = 5;

const GET_POSTS = gql`
  query getPosts($take: Int!, $after: Int) {
    posts(take: $take, after: $after) {
      pageInfo {
        hasMore
        endCursor
      }
      edges {
        node {
          id
          databaseId
          title
          slug
        }
      }
    }
  }
`;

const handleScroll = ({ currentTarget }: any, onLoadMore: ()=> void, hasMore: boolean) => {
  if (
    hasMore && 
    currentTarget.scrollTop + currentTarget.clientHeight >=
    currentTarget.scrollHeight 
  ) {
    onLoadMore();
  }
};

export default function Blog() {
  const { loading, error, data, fetchMore, networkStatus } = useQuery(GET_POSTS, {
    variables: {
      take: POSTS_PER_PAGE,
      after: null,
    },
    notifyOnNetworkStatusChange: true,
  });
  const posts = data?.posts?.edges?.map((edge: PostEdge) => edge.node) || [];
  const havePosts = Boolean(posts.length);
  const haveMorePosts = Boolean(data?.posts?.pageInfo?.hasMore);
  const loadingMore = networkStatus === NetworkStatus.fetchMore
  const loadMore = () => {
    fetchMore({
      variables: {
        take: 5,
        after: data.posts.pageInfo.endCursor
      },
    })
  }

  return (
    <Layout>
      <h1>Blog Scroll</h1>
      <div className="chapter-list"
        onScroll={e => handleScroll(e, loadMore, haveMorePosts)}>
      {!havePosts && loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>An error has occurred.</p>
      ) : !havePosts ? (
        <p>No posts found.</p>
      ) : (
        posts.map((post: Post) => {
          return (
            <article key={post.databaseId} style={{ border: "2px solid #eee", padding: "1rem", marginBottom: "1rem", borderRadius: "10px" }}>
              <h2>{post.title}</h2>
            </article>
          );
        })
      )}
      </div>
      {havePosts ? (
        haveMorePosts ? (
          <form onSubmit={event => {
            event.preventDefault();
            loadMore()
          }}>
            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Load more"}
            </button>
          </form>
        ) : (
          <p>✅ All posts loaded.</p>
        )
      ) : null}
      <style jsx>{`
        .chapter-list {
          display: block;
            border: 0px solid gray;
            padding: 5px;
            margin-top: 5px;
            width: 100%;
            height: 500px;
            overflow-y: scroll;
        }
      `}</style>  
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: GET_POSTS,
    variables: {
      take: POSTS_PER_PAGE,
      after: null,
    }
  });

  return addApolloState(apolloClient, {
    props: {},
  });
}
