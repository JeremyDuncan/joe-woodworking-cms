import React from 'react';
import {
    Activity, AlarmClock, Anchor, Apple, Armchair, ArrowRight, AtSign, Award, Axe, Baby, Backpack, BadgeCheck,
    Banknote, Battery, Bed, Bell, Bike, Bird, Book, BookOpen, Bookmark, Box, Briefcase, Bug, Building, Cake,
    Calculator, Calendar, Camera, Car, Cat, Check, Clock, Cloud, Code, Coffee, Coins, Compass, Cookie, CreditCard,
    Crown, Database, Diamond, Dog, DollarSign, Download, Droplet, Dumbbell, Egg, Eye, Factory, Feather, Film, Fish,
    Flag, Flame, Flower, Folder, Gamepad2, Gauge, Gem, Ghost, Gift, Globe, GraduationCap, Guitar, Hammer, Hand, Heart,
    Hexagon, Home, Image, Key, Keyboard, Landmark, Laptop, Leaf, Lightbulb, Link, Lock, Magnet, Mail, Map, MapPin,
    Medal, Megaphone, MessageCircle, MessageSquare, Mic, Monitor, Moon, Mountain, Music, Navigation, Newspaper,
    Package, Paintbrush, Palette, Paperclip, Pencil, Phone, PiggyBank, Pizza, Plane, Printer, Puzzle, Rabbit, Radio,
    Rocket, Ruler, Scissors, Search, Send, Settings, Shield, Ship, ShoppingBag, ShoppingCart, Shovel, Smile,
    Snowflake, Sofa, Sparkles, Speaker, Sprout, Star, Store, Sun, Sword, Tag, Target, Tent, ThumbsUp, Ticket, Timer,
    Train, Trash2, TreePine, TrendingUp, Trophy, Truck, Tv, Umbrella, Upload, User, Users, Utensils, Video, Wallet,
    Watch, Waves, Wifi, Wind, Wine, Wrench, Zap
} from 'lucide-react';

// Curated, searchable icon set used everywhere icons are configurable.
export const ICONS = {
    Star, Sparkles, Heart, Flag, Shield, Award, Medal, Trophy, Crown, Gem, Flame, Zap, Target, BadgeCheck, Check,
    ThumbsUp, Smile, Gift, Ticket, Tag, Sun, Moon, Snowflake, Cloud, Droplet, Waves, Wind, Leaf, Flower, Sprout,
    TreePine, Mountain, Feather, Bird, Fish, Cat, Dog, Rabbit, Bug, Anchor, Compass, Navigation, Map, MapPin, Globe,
    Home, Building, Landmark, Store, Factory, Tent, Hammer, Wrench, Shovel, Axe, Sword, Ruler, Paintbrush, Pencil,
    Palette, Scissors, Package, Truck, Ship, Plane, Train, Car, Bike, Rocket, ShoppingBag, ShoppingCart, CreditCard,
    Wallet, Banknote, Coins, DollarSign, PiggyBank, Briefcase, GraduationCap, Book, BookOpen, Bookmark, Newspaper,
    Folder, Image, Camera, Film, Video, Music, Guitar, Speaker, Mic, Radio, Gamepad2, Puzzle, Lightbulb, Key, Lock,
    Magnet, Gauge, Activity, TrendingUp, Database, Code, Keyboard, Laptop, Monitor, Tv, Phone, Mail, MessageCircle,
    MessageSquare, Megaphone, Bell, Send, Link, Paperclip, Settings, Search, Calendar, Clock, AlarmClock, Timer,
    Watch, Eye, Hand, User, Users, Baby, Coffee, Cookie, Cake, Pizza, Apple, Egg, Utensils, Wine, Dumbbell, Bed,
    Sofa, Armchair, Backpack, Umbrella, Battery, Wifi, Box, Diamond, Hexagon, Ghost, Calculator, AtSign, Printer,
    Trash2, Download, Upload, ArrowRight
};

export function DynamicIcon({name, ...props}) {
    const Cmp = ICONS[name] || ICONS.Star;
    return <Cmp {...props}/>;
}
