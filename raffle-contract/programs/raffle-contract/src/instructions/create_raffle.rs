use std::mem::size_of;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::errors::RaffleError;

pub fn create_raffle(_ctx: Context<CreateRaffle>, max_entrants: u32, end_timestamp: i64, ticket_price: u64) -> Result<()> {
    let raffle = &mut _ctx.accounts.raffle;
    raffle.creator = _ctx.accounts.creator.key();
    raffle.end_timestamp = end_timestamp;
    raffle.ticket_price = ticket_price;
    raffle.bump = *_ctx.bumps.get("raffle").unwrap();
    raffle.entrants = _ctx.accounts.entrants.key();
    raffle.revealed = false;

    let mut entrants = _ctx.accounts.entrants.load_init()?;

    if max_entrants > 1000 {
        return err!(RaffleError::MaxEntrantsTooLarge);
    }

    entrants.max = max_entrants;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    #[account(init, payer = creator, space = Raffle::LEN, seeds = [b"raffle", entrants.key().as_ref()], bump)]
    pub raffle: Account<'info, Raffle>,
    #[account(zero)]
    pub entrants: AccountLoader<'info, Entrants>,
    #[account(init, seeds = [b"proceeds", raffle.key().as_ref()], bump, payer = creator,
    token::mint = proceeds_mint, token::authority = raffle,)]
    pub proceeds: Account<'info, TokenAccount>,
    pub proceeds_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Raffle {
    pub creator: Pubkey,
    pub end_timestamp: i64,
    pub ticket_price: u64,
    pub entrants: Pubkey,
    pub bump: u8,
    pub revealed: bool
}

impl Raffle {
    const LEN: usize = 8 + size_of::<Raffle>();
}

#[account(zero_copy)]
pub struct Entrants {
    pub n_entrants: u32,
    pub max: u32,
    pub entrants: [Pubkey; 500],
    pub winners: [Pubkey; 100]
}

impl Entrants {
    pub fn append(&mut self, entrant: Pubkey) -> Result<()> {
        if self.n_entrants >= self.max {
            return err!(RaffleError::NotEnoughTicketsLeft);
        }

        self.entrants[self.n_entrants as usize] = entrant;
        self.n_entrants += 1;

        Ok(())
    }
}