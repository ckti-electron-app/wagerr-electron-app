<template>
  <div v-if="isLoading" class="no-transactions z-depth-2 text-center">Loading transactions...</div>

  <div v-else-if="transactionRecords.length === 0" class="no-transactions z-depth-2 text-center">
    <p>Currently, your wallet has no Wagerr transactions to list...</p>
  </div>

  <div v-else>
    <table class="main-table card z-depth-2">
      <thead>
        <tr>
          <th></th>

          <th class="hide-on-med-and-down">Date</th>

          <th class="hide-on-small-only">Trans<span>action</span> ID</th>

          <th class="hide-on-small-only">Type</th>

          <!--<th class="hide-on-med-and-down show-on-large">Blockhash</th>-->

          <th class="">Address</th>

          <th class="">Amount</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="tx in transactionRecords" :key="tx.id" class="tx-record">
          <td v-if="tx.confirmations === -1" class="confirmations">
            <el-tooltip :content="tx.confirmations + ' confirmations'">
              <i class="far fa-times-circle confirmation-conflicted"></i>
            </el-tooltip>
          </td>

          <td v-else-if="tx.confirmations === 0" class="confirmations">
            <el-tooltip :content="tx.confirmations + ' confirmations'">
              <i class="far fa-question-circle confirmation-pending"></i>
            </el-tooltip>
          </td>

          <td v-else-if="tx.confirmations > 0 && tx.confirmations < 6" class="confirmations">
            <el-tooltip :content="tx.confirmations + ' confirmations'">
              <i class="timer-loader"></i>
            </el-tooltip>
          </td>

          <td v-else class="confirmations">
            <el-tooltip :content="tx.confirmations + ' confirmations'">
              <i class="far fa-check-circle confirmation-success"></i>
            </el-tooltip>
          </td>

          <td
            class="hide-on-med-and-down"
            :class="{ 'confirmation-conflicted': tx.confirmations === -1 }"
          >
            {{ Number(tx.time) | moment('timezone', getTimezone, 'LLL') }}
          </td>

          <td
            class="hide-on-small-only"
            :class="{ 'confirmation-conflicted': tx.confirmations === -1 }"
          >
            <el-tooltip v-clipboard="tx.transactionid" content="Copy" class="transaction-list-link">
              <i class="far fa-copy" @click="copiedAlert()"></i>
            </el-tooltip>
            <el-tooltip content="Open in block explorer" class="transaction-list-link">
              <i class="fas fa-link" @click="blockExplorerUrl(tx.transactionid)"></i>
            </el-tooltip>
          </td>

          <td
            class="hide-on-small-only"
            :class="{ 'confirmation-conflicted': tx.confirmations === -1 }"
          >
            {{ tx.type }}
            <transaction-bet-popover
              v-if="(tx.type === 'BetPlaced' || tx.type === 'BetPayout') && tx.confirmations > 0"
              :type="tx.type"
              :tx-id="tx.transactionid"
              :tx-details="tx.details"
            >
            </transaction-bet-popover>
          </td>

          <!--<td class="hide-on-med-and-down show-on-large">{{tx.blockhash}}</td>-->

          <td class="" :class="{ 'confirmation-conflicted': tx.confirmations === -1 }">
            {{ tx.details[0] ? tx.details[0].address : '' }}
          </td>

          <td
            v-if="tx.debit < 0"
            class=""
            :class="{ 'confirmation-conflicted': tx.confirmations === -1 }"
          >
            {{ tx.debit }} {{ getNetworkType === 'Testnet' ? 'tWGR' : 'WGR' }}
          </td>

          <td
            v-else-if="tx.credit > 0"
            class=""
            :class="{ 'confirmation-conflicted': tx.confirmations === -1 }"
          >
            {{ tx.credit }} {{ getNetworkType === 'Testnet' ? 'tWGR' : 'WGR' }}
          </td>

          <td v-else class="" :class="{ 'confirmation-conflicted': tx.confirmations === -1 }">
            <small>Error: Could not determine amount.</small>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Vuex from 'vuex';
import TransactionBetPopover from './TransactionBetPopover.vue';
import { testnetParams, mainnetParams } from '../../../main/constants/constants';
import transactionsRPC from '../../services/api/transactions_rpc';

export default {
  name: 'TransactionList',

  components: { TransactionBetPopover },

  data() {
    return {
      isLoading: true,
      intervalHandle: null,
      transactionRecords: []
    };
  },

  computed: {
    ...Vuex.mapGetters(['getTimezone', 'getNetworkType'])
  },

  async mounted() {
    // Fetch transactions on mount.
    this.transactionRecords = await transactionsRPC.listTransactionRecords(100);
    this.isLoading = false;

    // Continue looping for new transactions while mounted.
    let isRunning = false;
    this.intervalHandle = setInterval(async () => {
      if (!isRunning) {
        isRunning = true;
        this.transactionRecords = await transactionsRPC.listTransactionRecords(100);
        isRunning = false;
      }
    }, 5000);
  },

  beforeDestroy() {
    clearInterval(this.intervalHandle);
  },

  methods: {
    blockExplorerUrl(txId) {
      const { shell } = require('electron');
      const explorerUrl =
        this.getNetworkType === 'Testnet'
          ? testnetParams.BLOCK_EXPLORER_URL
          : mainnetParams.BLOCK_EXPLORER_URL;

      shell.openExternal(`${explorerUrl}/#/tx/${txId}`);
    },

    copiedAlert() {
      M.toast({
        html:
          '<span class="toast__bold-font">Success &nbsp;</span> Transaction ID copied to clipboard.',
        classes: 'green'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../../assets/scss/_variables.scss';

.no-transactions p {
  font-size: 1.5em;
}

.no-transactions .fa-list-alt {
  color: $wagerr-red-dark;
  font-size: 10em;
}

.invalid {
  font-size: 1.1em;
  color: $wagerr-red-dark;
}

tbody tr {
  font-size: 1.1em;
}

.confirmations {
  padding: 15px 10px 10px 10px;
  font-size: 2.1em;
}

.confirmation-conflicted .tooltipped {
  color: $wagerr-red;
}

.confirmation-success .tooltipped {
  color: green;
}

.confirmation-pending .tooltipped {
  color: orangered;
}

.transaction-list-link {
  color: $gray-900;
  cursor: pointer;
  font-size: 1.5em;
  padding: 17px;
}

.transaction-list-link:hover {
  color: $wagerr-red-dark;
  cursor: pointer;
}
</style>
