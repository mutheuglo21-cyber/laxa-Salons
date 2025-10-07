"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp, Sparkles } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface LoyaltyCardProps {
  points: number
  tier: string
  memberSince?: string
}

export function LoyaltyCard({ points, tier, memberSince }: LoyaltyCardProps) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return "bg-gradient-to-br from-slate-400 to-slate-600"
      case "gold":
        return "bg-gradient-to-br from-yellow-400 to-yellow-600"
      case "silver":
        return "bg-gradient-to-br from-gray-300 to-gray-500"
      default:
        return "bg-gradient-to-br from-orange-400 to-orange-600"
    }
  }

  const getNextTier = () => {
    const lowerTier = tier.toLowerCase()
    if (lowerTier === "bronze") return { name: "Silver", points: 1000 }
    if (lowerTier === "silver") return { name: "Gold", points: 5000 }
    if (lowerTier === "gold") return { name: "Platinum", points: 10000 }
    return null
  }

  const nextTier = getNextTier()
  const memberSinceText = memberSince ? formatRelativeTime(memberSince) : "Recently"

  return (
    <Card className={`${getTierColor(tier)} text-white border-0 shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Loyalty Rewards
            </CardTitle>
            <CardDescription className="text-white/80">Member since {memberSinceText}</CardDescription>
          </div>
          <Award className="h-12 w-12 opacity-90" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Tier</span>
            <Badge variant="secondary" className="uppercase font-bold">
              {tier}
            </Badge>
          </div>
          <div className="text-4xl font-bold">{points.toLocaleString()} Points</div>
        </div>

        {nextTier && (
          <div className="pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm mb-2 font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Next Tier: {nextTier.name}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div
                className="bg-white rounded-full h-2.5 transition-all duration-500"
                style={{ width: `${Math.min((points / nextTier.points) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs mt-2 text-white/80">
              {nextTier.points - points > 0
                ? `${(nextTier.points - points).toLocaleString()} points to ${nextTier.name}`
                : `You've reached ${nextTier.name}!`}
            </p>
          </div>
        )}

        {!nextTier && (
          <div className="pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4" />
              <span>You've reached the highest tier!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
