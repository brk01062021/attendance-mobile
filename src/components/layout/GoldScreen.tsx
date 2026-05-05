import React from 'react';
import { ImageBackground, View } from 'react-native';
import { images } from '../../constants/images';

export default function GoldScreen({ children }: any) {
    return (
        <ImageBackground
            source={images.splashGold}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.10)',
                }}
            >
                {children}
            </View>
        </ImageBackground>
    );
}