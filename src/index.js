import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig } from './config.js';
import { getEventOffers } from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printWarning(message) {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('ticketmaster')
  .description(chalk.bold('Ticketmaster CLI') + ' - Event ticketing & commerce from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'API key (X-SSL-CERT-UID)')
  .option('--base-url <url>', 'API base URL (default: https://www.ticketmaster.com/commerce/v2)')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    }
    if (options.baseUrl) {
      setConfig('baseUrl', options.baseUrl);
      printSuccess('Base URL set');
    }
    if (!options.apiKey && !options.baseUrl) {
      printError('No options provided. Use --api-key or --base-url');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey') || 'Not set';
    const baseUrl = getConfig('baseUrl') || 'https://www.ticketmaster.com/commerce/v2 (default)';
    console.log(chalk.bold('\nTicketmaster CLI Configuration\n'));
    console.log('API Key:  ', chalk.cyan(apiKey === 'Not set' ? apiKey : '***' + apiKey.slice(-4)));
    console.log('Base URL: ', chalk.cyan(baseUrl));
    console.log('');
  });

// ============================================================
// EVENTS
// ============================================================

const eventsCmd = program.command('events').description('Manage events and offers');

eventsCmd
  .command('offers <eventId>')
  .description('Get available offers for an event')
  .option('--json', 'Output as JSON')
  .action(async (eventId, options) => {
    try {
      const data = await withSpinner(`Fetching offers for event ${eventId}...`, () => getEventOffers(eventId));

      if (options.json) {
        printJson(data);
        return;
      }

      const offers = data.offers || [];

      if (offers.length === 0) {
        printWarning('No offers available for this event');
        return;
      }

      console.log(chalk.bold(`\nEvent Offers (${offers.length} found)\n`));

      offers.forEach((offer, idx) => {
        const attrs = offer.attributes || {};
        console.log(chalk.cyan(`Offer ${idx + 1}:`));
        console.log('  ID:          ', offer.id || 'N/A');
        console.log('  Name:        ', attrs.name || 'N/A');
        console.log('  Type:        ', attrs.offerType || 'N/A');
        console.log('  Description: ', attrs.description || 'N/A');
        console.log('  Currency:    ', attrs.currency || 'N/A');

        if (attrs.prices && attrs.prices.length > 0) {
          console.log('  Prices:');
          attrs.prices.forEach(price => {
            console.log(`    - ${price.priceZone || 'General'}: ${price.value || 'N/A'} (Total: ${price.total || 'N/A'})`);
          });
        }

        if (attrs.limit) {
          console.log('  Limits:');
          if (attrs.limit.min) console.log(`    Min: ${attrs.limit.min}`);
          if (attrs.limit.max) console.log(`    Max: ${attrs.limit.max}`);
        }

        if (attrs.start || attrs.end) {
          console.log('  Availability:');
          if (attrs.start) console.log(`    Start: ${attrs.start}`);
          if (attrs.end) console.log(`    End: ${attrs.end}`);
        }

        console.log('');
      });

      // Show embedded data summary
      if (data._embedded) {
        const embedded = data._embedded;
        console.log(chalk.bold('Additional Information:'));
        if (embedded.priceZones?.data?.length) {
          console.log(`  Price Zones: ${embedded.priceZones.data.length}`);
        }
        if (embedded.areas?.data?.length) {
          console.log(`  Areas: ${embedded.areas.data.length}`);
        }
        if (embedded.passwords?.data?.length) {
          console.log(`  Password Protected: ${embedded.passwords.data.length}`);
        }
        console.log('');
      }

      printSuccess('Use --json flag for full details');

    } catch (error) {
      if (error.response) {
        printError(`API Error: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data) {
          console.error(chalk.dim(JSON.stringify(error.response.data, null, 2)));
        }
      } else {
        printError(error.message);
      }
      process.exit(1);
    }
  });

// ============================================================
// INFO
// ============================================================

program
  .command('info')
  .description('Show API information and limitations')
  .action(() => {
    console.log(chalk.bold('\nTicketmaster Commerce API v2\n'));
    console.log('The Commerce API provides access to event offers and ticketing data.');
    console.log('');
    console.log(chalk.yellow('API Limitations:'));
    console.log('  - Requires API key (X-SSL-CERT-UID) for most operations');
    console.log('  - Currently supports event offers lookup only');
    console.log('  - Transaction capabilities require approved access');
    console.log('');
    console.log(chalk.cyan('Available Commands:'));
    console.log('  ticketmaster events offers <eventId>  Get offers for an event');
    console.log('  ticketmaster config set --api-key KEY Set your API key');
    console.log('');
    console.log(chalk.dim('For event search and discovery, use the Discovery API.'));
    console.log(chalk.dim('API Documentation: http://developer.ticketmaster.com/'));
    console.log('');
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
