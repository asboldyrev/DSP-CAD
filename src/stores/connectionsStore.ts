import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Connection, ConnectionState } from '@/types/Connection'
import type { Node } from '@/types/Node'
import type { Item } from '@/types/Item'

export const useConnectionsStore = defineStore('connections', () => {
  const connections = ref<Connection[]>([])
  const connectionState = ref<ConnectionState>({
    isCreatingConnection: false,
    selectedNodeId: null
  })

  let nextConnectionId = 1

  // Получить все связи
  const getAllConnections = computed(() => connections.value)

  // Получить связи для конкретной ноды (входящие и исходящие)
  const getConnectionsForNode = (nodeId: number) => {
    return computed(() => {
      return connections.value.filter(conn => 
        conn.fromNodeId === nodeId || conn.toNodeId === nodeId
      )
    })
  }

  // Получить исходящие связи для ноды
  const getOutgoingConnections = (nodeId: number) => {
    return computed(() => {
      return connections.value.filter(conn => conn.fromNodeId === nodeId)
    })
  }

  // Получить входящие связи для ноды
  const getIncomingConnections = (nodeId: number) => {
    return computed(() => {
      return connections.value.filter(conn => conn.toNodeId === nodeId)
    })
  }

  // Начать создание связи
  function startCreatingConnection() {
    connectionState.value.isCreatingConnection = true
    connectionState.value.selectedNodeId = null
  }

  // Отменить создание связи
  function cancelCreatingConnection() {
    connectionState.value.isCreatingConnection = false
    connectionState.value.selectedNodeId = null
  }

  // Выбрать ноду для создания связи
  function selectNodeForConnection(nodeId: number, nodes: Node[]) {
    if (!connectionState.value.isCreatingConnection) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    if (connectionState.value.selectedNodeId === null) {
      // Первая нода выбрана
      connectionState.value.selectedNodeId = nodeId
    } else if (connectionState.value.selectedNodeId === nodeId) {
      // Кликнули по той же ноде - отменяем выбор
      connectionState.value.selectedNodeId = null
    } else {
      // Вторая нода выбрана - создаем связь
      createConnection(connectionState.value.selectedNodeId, nodeId, nodes)
      connectionState.value.isCreatingConnection = false
      connectionState.value.selectedNodeId = null
    }
  }

  // Создать связь между двумя нодами
  function createConnection(fromNodeId: number, toNodeId: number, nodes: Node[]) {
    const fromNode = nodes.find(n => n.id === fromNodeId)
    const toNode = nodes.find(n => n.id === toNodeId)

    if (!fromNode || !toNode) return

    // Проверяем, не существует ли уже такая связь
    const existingConnection = connections.value.find(conn => 
      conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId
    )

    if (existingConnection) return

    const connection: Connection = {
      id: nextConnectionId++,
      fromNodeId,
      toNodeId,
      fromX: fromNode.x,
      fromY: fromNode.y,
      toX: toNode.x,
      toY: toNode.y,
      syncSorters: true
    }

    connections.value.push(connection)
  }

  // Обновить координаты связи при перемещении ноды
  function updateConnectionCoordinates(nodeId: number, x: number, y: number) {
    connections.value.forEach(conn => {
      if (conn.fromNodeId === nodeId) {
        conn.fromX = x
        conn.fromY = y
      }
      if (conn.toNodeId === nodeId) {
        conn.toX = x
        conn.toY = y
      }
    })
  }

  // Удалить связь
  function deleteConnection(connectionId: number) {
    const index = connections.value.findIndex(conn => conn.id === connectionId)
    if (index !== -1) {
      connections.value.splice(index, 1)
    }
  }

  // Удалить все связи для ноды
  function deleteConnectionsForNode(nodeId: number) {
    connections.value = connections.value.filter(conn => 
      conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    )
  }

  // Обновить конвейер связи
  function updateConnectionBelt(connectionId: number, belt: Item | null) {
    const connection = connections.value.find(conn => conn.id === connectionId)
    if (connection) {
      if (belt) {
        connection.belt = belt
      } else {
        delete connection.belt
      }
    }
  }

  // Обновить входной сортер связи
  function updateConnectionInputSorter(connectionId: number, sorter: Item | null) {
    const connection = connections.value.find(conn => conn.id === connectionId)
    if (connection) {
      if (sorter) {
        connection.inputSorter = sorter
      } else {
        delete connection.inputSorter
      }
    }
  }

  // Обновить выходной сортер связи
  function updateConnectionOutputSorter(connectionId: number, sorter: Item | null) {
    const connection = connections.value.find(conn => conn.id === connectionId)
    if (connection) {
      if (sorter) {
        connection.outputSorter = sorter
      } else {
        delete connection.outputSorter
      }
    }
  }

  // Обновить синхронизацию сортеров связи
  function updateConnectionSyncSorters(connectionId: number, syncSorters: boolean) {
    const connection = connections.value.find(conn => conn.id === connectionId)
    if (connection) {
      connection.syncSorters = syncSorters
    }
  }

  // Обновить выбранный ресурс связи
  function updateConnectionSelectedResource(connectionId: number, resourceId: string) {
    const connection = connections.value.find(conn => conn.id === connectionId)
    if (connection) {
      connection.selectedResource = resourceId
    }
  }

  // Получить состояние создания связи
  const isCreatingConnection = computed(() => connectionState.value.isCreatingConnection)
  const selectedNodeId = computed(() => connectionState.value.selectedNodeId)

  return {
    // Состояние
    connections: getAllConnections,
    isCreatingConnection,
    selectedNodeId,
    
    // Методы
    startCreatingConnection,
    cancelCreatingConnection,
    selectNodeForConnection,
    createConnection,
    updateConnectionCoordinates,
    deleteConnection,
    deleteConnectionsForNode,
    getConnectionsForNode,
    getOutgoingConnections,
    getIncomingConnections,
    updateConnectionBelt,
    updateConnectionInputSorter,
    updateConnectionOutputSorter,
    updateConnectionSyncSorters,
    updateConnectionSelectedResource
  }
})