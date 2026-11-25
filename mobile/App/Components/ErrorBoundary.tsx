import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface ErrorBoundaryState {
    hasError: boolean;
}

// Top-level crash guard: without this, an uncaught render error anywhere in the
// tree crashes the whole app with no recovery UI and (until crash reporting is
// wired up) no record of it happening. Catches render-phase errors only - it
// cannot catch errors inside event handlers or async code, which is why every
// screen's own try/catch around API calls still matters.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.log('ErrorBoundary__caught', error, info?.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A1020' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                        Something went wrong
                    </Text>
                    <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                        Please try again. If this keeps happening, restart the app.
                    </Text>
                    <Pressable
                        onPress={this.handleReset}
                        style={{ backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
                    </Pressable>
                </View>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
