import React from 'react';
import { ImageBackground, View } from 'react-native';
import { images } from '../../constants/images';

export default function DarkScreen({ children }: any) {
    return (
        <ImageBackground
            source={images.splashDark}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(4,18,38,0.75)',
                }}
            >
                {children}
            </View>
        </ImageBackground>
    );
}