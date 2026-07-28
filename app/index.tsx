import { Redirect } from "expo-router";
import { useApp } from "@/providers/AppProvider";

export default function Index() {
  const { isHydrated, isAuthenticated } = useApp();

  // Chờ hydration xong rồi mới redirect
  if (!isHydrated) {
    return null;
  }

  // Nếu chưa đăng nhập → redirect sang login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Nếu đã đăng nhập → redirect sang trang chủ (tabs)
  return <Redirect href="/(tabs)" />;
}
