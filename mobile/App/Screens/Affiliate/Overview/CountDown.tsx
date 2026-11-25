import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

import Text from "../../../Components/text";

interface CountdownProps {
    date?: any;
    onComplete?: any
}

interface TimeState {
    completed: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const zeroPad = (num: number): string => String(num).padStart(2, "0");

const Countdown: React.FC<CountdownProps> = ({ date, onComplete }) => {
    const calculateTimeLeft = () => {
        const diff = date - Date.now();
        if (diff <= 0) {
            onComplete && onComplete();
            return { completed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return {
            completed: false,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    };

    const [time, setTime] = useState(calculateTimeLeft());

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <TimeBlock label=" d:" value={time.days} />
            <TimeBlock label=" h:" value={time.hours} />
            <TimeBlock label=" m:" value={time.minutes} />
            <TimeBlock label=" s" value={time.seconds} />
        </View>
    );
};

interface TimeBlockProps {
    label: string;
    value: number;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ label, value }) => (
    <View style={styles.block}>
        <Text size="small" family="bold">{zeroPad(value)}<Text size="xsmall">{label}</Text></Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    block: {
        alignItems: "center",
    }
});

export default Countdown;