import tornado.ioloop
import tornado.web
import tornado
from tornado import websocket
GLOBALS = {
    'sockets': [],
    'last_socket_id': 0,
    'last_collab_id': 0
}


class BaseHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")


class MainHandler(BaseHandler):
    def get(self):
        self.write("What're you doing here ?")


class ClientSocket(websocket.WebSocketHandler):
    """
        Handles WebSocket connection.
    """

    def __initialize__(self, user_name, collab_name):
        """
            Initializes a socket object from user name and collab name.
        """
        self.user_name = user_name
        self.socket_id = GLOBALS['last_socket_id'] + 1
        GLOBALS['last_socket_id'] += 1
        self.collab_name = collab_name

    def check_origin(self, origin):
        """
            Allow CORS.
        """
        return True

    def open(self):
        """
            Handles opening of new socket. This function creates a new
            socket and appends it to the global socket list.
        """
        user_name = self.get_argument('user_name')
        collab_name = self.get_argument('collab_name', None)
        self.__initialize__(user_name, collab_name)
        GLOBALS['sockets'].append(self)
        data = {
            'socket_id': self.socket_id,
            'user_name': self.user_name,
            'collab_name': self.collab_name
        }
        self.write_message(tornado.escape.json_encode(data))

    def on_message(self, message):
        """
            Handles receiving a message. When message is received from
            client, send it to others in that collaboration.
        """
        collab_name = self.collab_name
        collab_sockets = [socket for socket in GLOBALS['sockets']
                          if socket.collab_name == collab_name and
                          socket.user_name != self.user_name]
        for socket in collab_sockets:
            socket.write_message(message)

    def on_close(self):
        """
            Handles closing of a socket. Remove the socket from global
            sockets list.
        """
        GLOBALS['sockets'].remove(self)

    def __repr__(self):
        """
            Return string representation of socket object.
        """
        return 'Socket_ID:' + str(self.socket_id) + \
            ',CollabName:' + self.collab_name + ',User_name:' + self.user_name


class CheckCollab(BaseHandler):
    """
        Check if collab exists.
    """

    def post(self, *args, **kwargs):
        collab_name = self.get_argument('collab_name', None)
        collab_check = any(user for user in GLOBALS[
            'sockets'] if user.collab_name == collab_name)
        data = {
            'collab_check': collab_check
        }
        self.write(tornado.escape.json_encode(data))


class CheckSessionOpen(BaseHandler):
    """
        Check if user has an open session already.
    """

    def post(self, *args, **kwargs):
        user_name = self.get_argument('user_name', None)
        collab_name = self.get_argument('collab_name', None)
        connected = any(socket for socket in GLOBALS[
                        'sockets'] if socket.user_name == user_name and
                        socket.collab_name == collab_name)

        data = {
            'connected': connected
        }
        self.write(tornado.escape.json_encode(data))


class ListCollaborators(BaseHandler):
    """
        List all collaborators in a collab.
    """

    def post(self, *args, **kwargs):
        user_name = self.get_argument('user_name', None)
        collab_name = self.get_argument('collab_name', None)
        collabs = [socket for socket in GLOBALS['sockets']
                   if
                   socket.collab_name == collab_name
                   and
                   socket.user_name != user_name]

        data = {
            'collabs': collabs
        }
        self.write(tornado.escape.json_encode(data))


application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/socket", ClientSocket),
    (r"/check/session", CheckSessionOpen),
    (r"/check/collab", CheckCollab),
    (r"/list/collabs", ListCollaborators)
])

if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
