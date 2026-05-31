import React from 'react';
import {
    Anchor, ArrowRight, Award, BadgeCheck, Bell, Briefcase, Building, Calendar, Camera, Check, Clock, Coffee, Compass,
    Crown, Feather, Flag, Flame, Gem, Gift, Globe, Hammer, Heart, Home, Image, Leaf, Lightbulb, Lock, MapPin, Mail,
    Medal, Megaphone, MessageCircle, Package, Paintbrush, Palette, Pencil, Phone, Ruler, Scissors, Send, Settings,
    Shield, ShoppingBag, Smile, Sparkles, Star, Sun, Tag, Target, ThumbsUp, Trophy, Truck, Users, Wrench, Zap
} from 'lucide-react';

// Curated, searchable icon set used everywhere icons are configurable.
export const ICONS = {
    Flag, Star, Sparkles, Shield, Award, Medal, Trophy, Crown, Gem, Heart, ThumbsUp, Smile, Check, BadgeCheck, Target,
    Zap, Flame, Sun, Leaf, Feather, Anchor, Compass, Globe, MapPin, Home, Building, Briefcase, Users, Mail, Phone, Send,
    MessageCircle, Megaphone, Bell, Calendar, Clock, Camera, Image, Palette, Paintbrush, Pencil, Ruler, Scissors, Hammer,
    Wrench, Package, Truck, ShoppingBag, Tag, Gift, Lightbulb, Lock, Settings, Coffee, ArrowRight
};

export function DynamicIcon({name, ...props}) {
    const Cmp = ICONS[name] || ICONS.Star;
    return <Cmp {...props}/>;
}
