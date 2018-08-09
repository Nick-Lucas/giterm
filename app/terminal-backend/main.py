import tornado.web
from tornado.ioloop import IOLoop
from terminado import TermSocket, SingleTermManager

class TerminalHandler(TermSocket):
  def check_origin(self, origin):
    return True


if __name__ == '__main__':
  term_manager = SingleTermManager(shell_command=['bash'])
  handlers = [
              (r"/websocket", TerminalHandler, {'term_manager': term_manager})
              ]
  app = tornado.web.Application(handlers)
  app.listen(8010)
  IOLoop.current().start()
