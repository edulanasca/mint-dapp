use anchor_lang::{prelude::*, solana_program::sysvar};
use crate::errors::RaffleError;
use crate::instructions::create_raffle::{Raffle, Entrants};
use crate::utils::{randomness_tools, recent_blockhashes};

pub const TIME_BUFFER: i64 = 20;

pub fn reveal_winners(ctx: Context<RevealWinners>) -> Result<()> {
    let clock = Clock::get()?;
    let raffle = &mut ctx.accounts.raffle;
    let mut entrants = ctx.accounts.entrants.load_mut()?;

    let end_timestamp_with_buffer = raffle
        .end_timestamp
        .checked_add(TIME_BUFFER)
        .ok_or(RaffleError::InvalidCalculation)?;

    // if clock.unix_timestamp < end_timestamp_with_buffer {
    //     return err!(RaffleError::RaffleStillRunning);
    // }

    let randomness =
        recent_blockhashes::last_blockhash_accessor(&ctx.accounts.recent_blockhashes)?;

    if !raffle.revealed {
        let mut winners_ix = [Pubkey::default(); 100];
        (0..100).for_each(|n| {
            let winner_rand = randomness_tools::expand(randomness, n) as usize % entrants.n_entrants as usize;
            winners_ix[n as usize] = entrants.entrants[winner_rand];
        });

        entrants.winners = winners_ix;
    } else {
        return err!(RaffleError::WinnersAlreadyDrawn)
    }

    raffle.revealed = true;

    Ok(())
}

#[derive(Accounts)]
pub struct RevealWinners<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub entrants: AccountLoader<'info, Entrants>,
    /// CHECK: contains recent blockchashes
    #[account(address = sysvar::recent_blockhashes::ID)]
    pub recent_blockhashes: UncheckedAccount<'info>,
}