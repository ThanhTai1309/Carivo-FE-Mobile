import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TriangleAlert } from "lucide-react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
          <TriangleAlert size={28} color="#b91c1c" strokeWidth={2.2} />
        </View>
        <Text className="text-xl font-bold text-foreground text-center">
          {this.props.fallbackTitle ?? "Đã xảy ra lỗi"}
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-2 leading-5">
          {error.message || "Vui lòng thử lại sau."}
        </Text>
        <TouchableOpacity
          onPress={this.handleRetry}
          activeOpacity={0.85}
          className="mt-6 rounded-xl bg-primary px-6 py-3"
        >
          <Text className="text-white font-bold text-sm">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
