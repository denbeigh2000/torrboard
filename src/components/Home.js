import React, { useState } from 'react'
import styled from 'styled-components'
import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import get from 'lodash/get'
import { useToasts } from 'react-toast-notifications'

import Placeloader from './Placeloader'
import SearchInput from './SearchInput'
import Modal from './Modal'
import MediaCard, { CARD_HEIGHT, CARD_WIDTH } from './MediaCard'
import MediaModal from './MediaModal'
import { Filters, FilterValue } from './Filters'

import apiHandlers from '../fn/apiHandlers'
import { useStore } from '../state'

const GET_MEDIAS = gql`
  {
    watched
    deluge {
      torrents {
        name
        videos
        time_added
        rar
        state
        meta {
          title
          resolution
          episode
          season
        }
        mediaInfo {
          id
          title
          type
          image
          plot
          rating
          tags
          year
        }
      }
    }
  }
`

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`

const CardFallback = styled.div`
  padding: 10px;
`

export default () => {
  const [query, setQuery] = useState('')
  const [sortBy, setSort] = useState('time')
  const [item, selectItem] = useState(null)
  const [category, setCategory] = useState(null)
  const { addToast } = useToasts()
  const [, dispatch] = useStore()

  const { loading, data } = useQuery(GET_MEDIAS, {
    pollInterval: 10e3,
    ...apiHandlers({
      addToast,
      onError: ({ msg }) => {
        if (msg.includes('fuck out')) {
          dispatch({ type: 'LOGOUT' })
        }
      },
    }),
  })

  const watched = get(data, 'watched', []).reduce((acc, path) => ((acc[path] = true), acc), {})

  const reduced = get(data, 'deluge.torrents', [])
    .sort((a, b) =>
      sortBy === 'time'
        ? b.time_added - a.time_added
        : get(a, 'mediaInfo.title', a.name).localeCompare(get(b, 'mediaInfo.title', b.name)),
    )
    .reduce((acc, cur) => {
      const key = get(cur, 'mediaInfo.id') || cur.name

      if (category && !get(cur, 'mediaInfo.tags', []).includes(category)) {
        return acc
      }

      if (
        query &&
        !get(cur, 'mediaInfo.title', cur.name)
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return acc
      }

      if (!acc[key]) {
        acc[key] = { ...cur }
      } else {
        acc[key].videos = acc[key].videos.concat(cur.videos).sort((a, b) => b - a)
      }

      return acc
    }, {})

  const list = Object.keys(reduced)
    .map(k => reduced[k])
    .filter(item => item.videos.length || item.rar)

  return (
    <div>
      <SearchInput onChange={e => setQuery(e.target.value)} />

      <Filters>
        <div>
          {['time', 'alpha'].map(value => (
            <FilterValue active={sortBy === value} key={value} onClick={() => setSort(value)}>
              {value}
            </FilterValue>
          ))}
        </div>

        <div>
          {['action', 'animation', 'sci-fi', 'drama', 'horror'].map(value => (
            <FilterValue
              active={category === value}
              key={value}
              onClick={() => setCategory(category === value ? null : value)}
            >
              {value}
            </FilterValue>
          ))}
        </div>
      </Filters>

      <Grid>
        {loading &&
          [...Array(30).keys()].map(id => (
            <MediaCard key={id}>
              <Placeloader
                time={Math.max(1000, Math.floor(Math.random() * 3000))}
                style={{ height: CARD_HEIGHT, width: CARD_WIDTH }}
              />
            </MediaCard>
          ))}

        {list.map((item, i) => (
          <MediaCard
            onClick={() => selectItem(item)}
            bg={get(item, 'mediaInfo.image')}
            key={`${item.id}-${i}`}
            interactive
          >
            {!get(item, 'mediaInfo.image') && (
              <CardFallback>{get(item, 'mediaInfo.title') || item.name}</CardFallback>
            )}
          </MediaCard>
        ))}
      </Grid>

      <Modal isOpened={!!item} onClose={() => selectItem(null)}>
        {item && <MediaModal item={item} watched={watched} />}
      </Modal>
    </div>
  )
}
