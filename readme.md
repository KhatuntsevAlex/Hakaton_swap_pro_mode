# DX25 Hackathon Submission

## Summary
This repository contains our submission for the MultiversX Hackathon. While our project may not fully meet all the criteria (not all the code was shared because of the dependencies and difficulties in extracting new parts from the old ones), we believe it embodies the spirit of the hackathon. We have built 2 features on top of the DX25: pro mode for swap and new add liquidity UI and logic.

## Problem Statement
In the world of decentralized exchanges, users often encounter challenges related to UX, trading efficiency and liquidity provision. Traditional market orders are not always replicable, and providing liquidity can be complicated, especially when dealing with minimum and maximum price parameters. Our goal was to address these issues and make trading and liquidity provision on DX25 more user-friendly and accessible, thus attracting new users, increasing overall liquidity and efficiency of the DEX.

## Overview
Our team's contribution to DX25 comprises two key features:

### 1. Pro Swap
We aimed to elevate the trading experience on DX25 by introducing the "Pro Swap" feature. This feature provides users with real-time information about price movements within specific liquidity pools due to our integration of trading view chart, that gets the data from our databases. Recognizing that arbitrage bots often drive price movements within these pools, we realized that this data could effectively reflect the broader asset market trends. Additionally, leveraging DX25's unique features, including concentrated liquidity and multiple fee levels, allows users to execute trades with minimal price impact and reduced commissions, mirroring the experience of traditional market orders.

<img width="1226" alt="pro_swap" src="https://github.com/KhatuntsevAlex/Hakaton_swap_pro_mode/assets/95035799/f123af67-1f75-4fae-8552-7aa65cfb9f97">


### 2. Adding Liquidity with Leverage
Our second major focus was simplifying the process of adding liquidity on DX25. We identified that users often struggle when working with minimum and maximum price parameters. To address this, we redesigned the liquidity provision process, making it more interactive and easy to understand. Our solution introduces key parameters like "ratio" and "leverage" (concentration) to streamline the liquidity addition process. By doing so, we eliminate the need for users to directly interact with minimum and maximum price values, empowering them to create liquidity positions that align with their preferences, whether they seek highly concentrated, single-sided, custom, or other tailored positions.

<img width="829" alt="add_liquidity_with_leverage" src="https://github.com/KhatuntsevAlex/Hakaton_swap_pro_mode/assets/95035799/76f97eaf-a2ef-4d61-8525-1ad7ace54bf4">

## Usage
Our features were already added to DX25 mainnet and we will continue working on improving them based on the users' feedback.

## Conclusion
We appreciate the opportunity to participate in the MultiversX Hackathon and present our contributions. Our project aims to enhance the MultiversX ecosystem by improving the new concentrated liqudity DEX by providing users with valuable insights and a streamlined interface for trading and liquidity provision. While we acknowledge that our submission may not meet all criteria, we believe it aligns with the hackathon's spirit of innovation and improvement.

Thank you for considering our submission, and we look forward to further collaboration with the MultiversX ecosystem.
