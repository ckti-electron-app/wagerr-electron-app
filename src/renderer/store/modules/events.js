import wagerrRPC from '@/services/api/wagerrRPC';
import moment from 'moment';

const state = function () {

    return {
        eventsFilter:  '',
        eventsList: {}
    }

};

const getters = {

    eventsFilter: (state) => {
        return state.eventsFilter;
    },

    eventsList: (state) => {
        return state.eventsList;
    }

};

const actions = {

    eventsFilter ({commit, state}, eventsFilter) {
        commit('setEventsFilter', eventsFilter);
    },

    // Todo - marty: remove code dupliation!
    listEvents ({commit, state}, filter) {
        return new Promise((resolve, reject) => {
            if (filter) {
                wagerrRPC.client.listEvents(filter)
                    .then(function (resp) {
                        // Filter events that are expired (15 mins before event start time)
                        let filteredList = [];
                        let numEvents    = resp.result.length;

                        for (let i = 0; i < numEvents; i++) {
                            // Prevent events that are starting in less than 12 mins getting listed.
                            if (resp.result[i].starting - (12 * 60) > moment().unix()) {
                                filteredList.push(resp.result[i]);
                            }
                        }

                        // Sort events by start time.
                        filteredList.sort(function(x, y) {
                            return x.starting - y.starting;
                        });

                        commit('setEventsList', filteredList);
                        resolve();
                    })
                    .catch(function (err) {
                        // TODO Handle `err` properly.
                        console.error(err);
                        reject(err);
                    })
            }
            else {
                wagerrRPC.client.listEvents()
                    .then(function (resp) {
                        // Filter events that are expired (15 mins before event start time)
                        let filteredList = [];
                        let numEvents    = resp.result.length;

                        for (let i = 0; i < numEvents; i++) {
                            if (resp.result[i].starting - (12 * 60) > moment().unix()) {
                                filteredList.push(resp.result[i]);
                            }
                        }

                        // Sort events by start time.
                        filteredList.sort(function(x, y) {
                            return x.starting - y.starting;
                        });

                        commit('setEventsList', filteredList);
                        resolve();
                    })
                    .catch(function (err) {
                        // TODO Handle `err` properly.
                        console.error(err);
                        reject(err);
                    })
            }
       });
    }

};

const mutations = {

    setEventsFilter (state, filter) {
        state.eventsFilter = filter;
    },

    setEventsList (state, eventsList) {
        state.eventsList = eventsList;
    }

};

export default {
    state,
    getters,
    actions,
    mutations
}
