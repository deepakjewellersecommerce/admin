import GuestGuard from "@/auth-guard/guest-guard";
import { Navigate, useRoutes } from "react-router-dom";
import {
  AddBannerForm,
  AddBlogForm,
  AddBrandForm,
  AddCategory,
  AddColorForm,
  AddCouponForm,
  AddProductPage,
  AddProductVariant,
  BannersList,
  BlogsList,
  BrandsList,
  CartView,
  CategoryList,
  CategoryPage,
  ColorList,
  CompactLayout,
  CouponsList,
  DashboardAppPage,
  DashboardLayout,
  EditCategoryForm,
  EditColorForm,
  EditCouponForm,
  LoginPage,
  LoyaltyProgramSettings,
  LoyaltyUsersList,
  MetalPricingDashboard,
  NoticationPage,
  PriceComponentsPage,
  OrderView,
  OrdersList,
  Page404,
  ProductListPage,
  ProductRatingPage,
  ProductVariantList,
  UpdateBannerForm,
  UpdateBlogForm,
  UpdateBrandForm,
  UpdateProductForm,
  UpdateProductImage,
  UpdateProductVariant,
  UploadProducts,
  UsersList,
  WebSettingsForm,
  SubcategoriesPage,
  CategoryManagementPage,
  SubcategoryListPage,
  AddCategoryPage,
  AddSubcategoryPage,
} from "./elements";
import ProductRatingList from "@/components/product-rating/product-rating-list";
import UpdateRatingForm from "@/components/review/update-review-form";
import AddReviewForm from "@/components/review/add-review-form";
import UploadVarients from "@/components/products/upload-varients";

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: "/",
      children: [
        { element: <Navigate to={"/auth/login"} />, index: true },

        {
          element: <CompactLayout />,
          children: [{ path: "404", element: <Page404 /> }],
        },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    {
      path: "auth/",
      children: [
        {
          path: "login",
          element: (
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          ),
        },
      ],
    },
    {
      path: "dashboard/",
      errorElement: <Page404 />,
      Component: DashboardLayout,
      children: [
        {
          path: "",
          index: true,
          element: (
            <GuestGuard>
              <DashboardAppPage />
            </GuestGuard>
          ),
        },
        {
          path: "coupons/list",
          element: <CouponsList />,
        },

        {
          path: "coupons/add",
          element: <AddCouponForm />,
        },
        {
          path: "coupons/edit/:id",
          element: <EditCouponForm />,
        },
        {
          path: "orders/list",
          element: <OrdersList />,
        },
        {
          path: "brands/list",
          element: <BrandsList />,
        },
        {
          path: "brands/add",
          element: <AddBrandForm />,
        },
        {
          path: "brands/edit/:id",
          element: <UpdateBrandForm />,
        },
        {
          path: "banners/list",
          element: <BannersList />,
        },
        {
          path: "banners/add",
          element: <AddBannerForm />,
        },
        {
          path: "banners/update/:id",
          element: <UpdateBannerForm />,
        },
        {
          path: "orders/:id",
          element: <OrderView />,
        },
        {
          path: "products/add",
          element: (
            <GuestGuard>
              <AddProductPage />
            </GuestGuard>
          ),
        },
        {
          path: "products/view/:id",
          element: <ProductVariantList />,
        },
        {
          path: "products/varients",
          element: <UploadVarients />,
        },
        // Dynamic pricing removed (not applicable for skin care store)
        {
          path: "products/rating/:productId",
          element: <ProductRatingList />,
        },
        {
          path:"product_ratings/:id",
          element:<UpdateRatingForm/>
        },
        {
          path:"product/add_rating/:id",
          element:<AddReviewForm/>
        },
        {
          path: "product-variant/:productVariantId/edit",
          element: <UpdateProductVariant />,
        },
        {
          path: "product/images/:productId/:colorId",
          element: <UpdateProductImage />,
        },
        {
          path: "product-variant/:id/add",
          element: <AddProductVariant />,
        },

        {
          path: "products/list",
          element: (
            <GuestGuard>
              <ProductListPage />
            </GuestGuard>
          ),
        },
        {
          path: "products/edit/:id",
          element: <UpdateProductForm />,
        },
        {
          path: "settings/web",
          element: <WebSettingsForm />,
        },
        {
          path: "notifications",
          element: <NoticationPage />,
        },
        {
          path: "categories/list",
          element: (
            <GuestGuard>
              <CategoryList />
            </GuestGuard>
          ),
        },
        {
          path: "categories/hierarchy",
          element: (
            <GuestGuard>
              <CategoryHierarchyPage />
            </GuestGuard>
          ),
        },
        {
          path: "categories/add",
          element: <AddCategory />,
        },
        {
          path: "categories/view/:id",
          element: <CategoryPage />,
        },
        {
          path: "categories/edit/:id",
          element: <EditCategoryForm />,
        },
        {
          path: "products/upload",
          element: (
            <GuestGuard>
              <UploadProducts />
            </GuestGuard>
          ),
        },
        {
          path: "products/ratings",
          element: <ProductRatingPage />,
        },
        {
          path: "users/list",
          element: (
            <GuestGuard>
              <UsersList />
            </GuestGuard>
          ),
        },
        {
          path: "users/cart/:id",
          element: <CartView />,
        },
        {
          path: "blogs/list",
          element: <BlogsList />,
        },
        {
          path: "blogs/add",
          element: <AddBlogForm />,
        },
        {
          path: "blogs/:id",
          element: <UpdateBlogForm />,
        },
        {
          path: "loyalty/users",
          element: <LoyaltyUsersList />,
        },
        {
          path: "loyalty/settings",
          element: <LoyaltyProgramSettings />,
        },
        {
          path: "colors/list",
          element: <ColorList />,
        },
        {
          path: "colors/add",
          element: <AddColorForm />,
        },
        {
          path: "colors/:id/edit",
          element: <EditColorForm />,
        },
        // Multi-Metal Pricing & Catalog Routes
        {
          path: "pricing/metals",
          element: <MetalPricingDashboard />,
        },
        {
          path: "catalog/categories",
          element: <CategoryManagementPage />,
        },
        {
          path: "catalog/hierarchy",
          element: <CategoryHierarchyPage />,
        },
        {
          path: "catalog/categories/add",
          element: <AddCategoryPage />,
        },
        {
          path: "catalog/categories/:categoryId",
          element: <SubcategoryListPage />,
        },
        {
          path: "catalog/categories/:categoryId/add",
          element: <AddSubcategoryPage />,
        },
        {
          path: "catalog/categories/:categoryId/:subId",
          element: <SubcategoryListPage />,
        },
        {
          path: "catalog/categories/:categoryId/:subId/add",
          element: <AddSubcategoryPage />,
        },
        {
          path: "catalog/subcategories",
          element: <SubcategoriesPage />,
        },
        {
          path: "catalog/price-components",
          element: <PriceComponentsPage />,
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/404" replace />,
    },
  ]);
}
