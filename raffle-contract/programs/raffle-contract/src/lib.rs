pub mod instructions;
pub mod utils;
mod errors;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("5V5CtozHPuT7ojDiXiPtEPPpYxwsEpVMWVGSHL9pub5Z");

#[program]
pub mod raffle_contract {
    use super::*;

    pub fn create_raffle(_ctx: Context<CreateRaffle>, max_entrants: u32, end_timestamp: i64, ticket_price: u64) -> Result<()> {
        instructions::create_raffle(_ctx, max_entrants, end_timestamp, ticket_price)
    }

    pub fn buy_tickets(_ctx: Context<BuyTickets>, amount: u16) -> Result<()> {
        instructions::buy_tickets(_ctx, amount)
    }

    pub fn reveal_winners(_ctx: Context<RevealWinners>) -> Result<()> {
        instructions::reveal_winners(_ctx)
    }
}
