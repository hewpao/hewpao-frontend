"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useGetPaginatedProductRequests } from "@/api/productRequest/useProductRequest";
import MakeOfferButton from "./MakeOfferBtn";
import { useEffect, useState, useRef } from "react";

function ProductCard() {
  const pathname = usePathname();
  const isTravelerPage = pathname.includes("/product-requests");

  // State for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Store the last loaded page to prevent duplicate loading
  const lastLoadedPage = useRef(0);

  const pageSize = 8; // Items per page

  // Fetch data with current page
  const {
    data: productData,
    isLoading: loadingProducts,
    error,
    refetch: productFetch,
  } = useGetPaginatedProductRequests(page, pageSize);

  // Update allProducts when new data is fetched
  useEffect(() => {
    productFetch();

    // If we're already loading more, don't process this update
    if (lastLoadedPage.current === page) {
      return;
    }

    // Handle errors by stopping loading state
    if (error) {
      console.error("Error fetching products:", error);
      setIsLoadingMore(false);
      return;
    }

    // Check if productData exists and has a data property
    const hasValidData =
      productData &&
      productData.data !== undefined &&
      productData.data !== null;

    // Check if data is an array with items
    const hasDataArray = hasValidData && Array.isArray(productData.data);

    // Valid data handling
    if (hasDataArray) {
      // Update the last loaded page
      lastLoadedPage.current = page;

      // Add new products to the list, avoiding duplicates
      setAllProducts((prev) => {
        // If it's the first page, just use the data directly
        if (page === 1) return productData.data;

        // For subsequent pages, filter out duplicates
        const newProducts = productData.data.filter(
          (newProduct) =>
            !prev.some(
              (existingProduct) => existingProduct.id === newProduct.id,
            ),
        );

        // Check if we've reached the end
        if (productData.data.length < pageSize || newProducts.length === 0) {
          setHasMore(false);
        }

        return [...prev, ...newProducts];
      });
    } else {
      // Handle the case where the API returns empty object or other invalid format
      if (page === 1) {
        // If this happens on the first page, there are no products
        setAllProducts([]);
      }
      // Either way, we've reached the end of data
      setHasMore(false);
    }

    // Always reset loading flag when we get a response
    setIsLoadingMore(false);
  }, [productData, page, pageSize, error]);

  // Manual load more function
  const handleManualLoad = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  // Initial loading state
  if (loadingProducts && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Empty state - no products at all
  if (!loadingProducts && (!allProducts || allProducts.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p className="text-lg text-gray-700 font-bold">No product requests found</p>
          <p className="text-gray-500 mt-2">Check back later for new products</p>
        </div>
      </div>
    );
  }

  // Render products
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allProducts.map((product) => {
          // Safely check for required properties before rendering
          if (!product || !product.id) return null;

          return (
            <div
              key={product.id}
              className="rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition-all duration-200 flex flex-col h-full"
            >
              {/* Product Image - with error handling */}
              <div className="w-full h-48 flex items-center justify-center bg-[#00000000]">
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name || "Product Request Image"}
                    width={180}
                    height={180}
                    className="rounded object-contain h-full w-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-gray-400">No image</p>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <h2 className="mt-4 font-semibold text-gray-800 line-clamp-2">
                {product.name || "Unnamed Product"}
              </h2>

              <div className="mt-auto">
                <div className="mt-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">From:</span>
                    <span className="ml-2">
                      {product.deliver_from || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mt-1 mb-2">
                    <span className="font-medium">To:</span>
                    <span className="ml-2">
                      {product.deliver_to || "Not specified"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">
                  Retailer price:{" "}
                  <span className="font-bold text-primary">
                    {typeof product.budget === 'number' ? `${product.budget} THB` : "Price not set"}
                  </span>
                </p>

                {isTravelerPage && product.id && (
                  <div className="mt-3">
                    <MakeOfferButton productRequestID={product.id} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button - simpler approach to avoid loop issues */}
      {hasMore ? (
        <div className="flex justify-center py-6">
          <button
            onClick={handleManualLoad}
            disabled={isLoadingMore}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isLoadingMore 
                ? "bg-gray-400 text-white cursor-not-allowed" 
                : "bg-primary text-white hover:bg-dark-primary"
            }`}
          >
            {isLoadingMore ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin bg:primary"></div>
                <span>Loading...</span>
              </div>
            ) : (
              "Load More Products"
            )}
          </button>
        </div>
      ) : (
        allProducts.length > 0 && (
          <div className="text-center bg-gray-50 px-6 py-4 rounded-lg">
            <p className="text-gray-500">You&#39;ve seen all products</p>
            <p className="text-gray-400 text-sm mt-1">No more items to display</p>
          </div>
        )
      )}
    </div>
  );
}

export default ProductCard;
